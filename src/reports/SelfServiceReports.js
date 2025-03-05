import React, { useEffect, useState } from "react";
import ScreenWithAppBar from "../common/components/ScreenWithAppBar";
import { reportSideBarOptions } from "./Common";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import { Box, makeStyles } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import MetabaseSVG from "./Metabase_icon.svg";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import { debounce } from "lodash";
import DeleteIcon from "@material-ui/icons/Delete";
import httpClient from "../common/utils/httpClient";
import MetabaseSetupStatus from "./domain/MetabaseSetupStatus";
import { CopyToClipboard } from "react-copy-to-clipboard/lib/Component";

const useStyles = makeStyles({
  root: {
    maxWidth: 600,
    backgroundColor: "#FFF",
    padding: "20px",
    position: "relative"
  },
  metabaseHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0px",
    marginBottom: "8px"
  },
  setupButtonContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginRight: 10
  },
  setupButton: {
    backgroundColor: "#4995ec",
    color: "#FFF",
    "&:hover": {
      backgroundColor: "#4995ec"
    }
  },
  setupDoneLabel: {
    position: "absolute",
    top: 20,
    right: 20,
    color: "green",
    border: "1px solid green",
    padding: "5px 10px",
    borderRadius: "5px"
  },
  buttonsContainer: {
    marginTop: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 10
  },
  refreshButton: {
    backgroundColor: "#4995ec",
    color: "#FFF",
    "&:hover": {
      backgroundColor: "#4995ec"
    }
  },
  exploreButton: {
    backgroundColor: "#4995ec",
    color: "#FFF",
    "&:hover": {
      backgroundColor: "#4995ec"
    }
  },
  metabaseLink: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "10px",
    color: "#757575",
    textDecoration: "none",
    margin: 0
  },
  redirectIcon: {
    fontSize: "1rem",
    marginLeft: "5px"
  },
  metabaseTitle: {
    marginBottom: 0,
    padding: 0
  }
});

// not sure why useState didn't work for maintaining this state
let intervalId = null;

const SelfServiceReports = () => {
  const classes = useStyles();

  const [statusResponse: MetabaseSetupStatus, setStatusResponse] = useState(MetabaseSetupStatus.createUnknownStatus());

  useEffect(() => {
    fetchSetupStatus();
  }, []);

  async function performAction(url) {
    await httpClient.post(url);
    const statusResponse = (await httpClient.get("/web/metabase/status")).data;
    setStatusResponse(MetabaseSetupStatus.fromStatusResponse(statusResponse));
    intervalId = setInterval(() => fetchSetupStatus(), 2000);
  }

  const fetchSetupStatus = debounce(async () => {
    const statusResponse = (await httpClient.get("/web/metabase/status")).data;
    const metabaseSetupStatus = MetabaseSetupStatus.fromStatusResponse(statusResponse);
    if (!metabaseSetupStatus.isAnyJobInProgress() && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    setStatusResponse(metabaseSetupStatus);
  }, 500);

  const tearDownMetabase = debounce(async () => {
    await performAction("/web/metabase/teardown");
  }, 500);

  const setupReports = debounce(async () => {
    await performAction("/web/metabase/setup");
  }, 500);

  const refreshReports = debounce(async () => {
    await performAction("/web/metabase/update-questions");
  }, 500);

  if (statusResponse.status === MetabaseSetupStatus.Unknown) {
    return <>Loading...</>;
  }

  return (
    <ScreenWithAppBar appbarTitle="Self Service Reports" enableLeftMenuButton={true} sidebarOptions={reportSideBarOptions}>
      <Card className={classes.root}>
        <CardContent>
          <Box style={{ display: "flex", flexDirection: "column" }}>
            <Box style={{ display: "flex", flexDirection: "row" }}>
              <img src={MetabaseSVG} alt="Metabase logo" style={{ height: 50, width: 50 }} />
              <div className={classes.metabaseHeader}>
                <Typography variant="h4" component="h4" className={classes.metabaseTitle}>
                  Metabase
                </Typography>
                <a href="https://metabase.com" target="_blank" rel="noopener noreferrer" className={classes.metabaseLink}>
                  metabase.com
                  <OpenInNewIcon className={classes.redirectIcon} />
                </a>
              </div>
              {statusResponse.canStartSetup() && (
                <div className={classes.setupButtonContainer}>
                  <Button className={classes.setupButton} onClick={setupReports} disabled={statusResponse.isSetupInProgress()}>
                    Setup Reports
                  </Button>
                </div>
              )}
              {statusResponse.isSetupInProgress() && (
                <div className={classes.setupButtonContainer}>
                  <Button className={classes.setupButton} disabled={true}>
                    Setup Reports
                  </Button>
                </div>
              )}
            </Box>
            <Typography variant="body2" color="textSecondary" component="p">
              Metabase provides a graphical interface to create business intelligence and analytics graphs in minutes. Avni integrates with
              Metabase to support ad hoc and self-serviced reports.
            </Typography>
            <Box style={{ display: "flex", flexDirection: "row-reverse" }}>
              {statusResponse.isSetupComplete() && !statusResponse.isAnyJobInProgress() && (
                <div className={classes.buttonsContainer}>
                  <Button
                    style={{
                      float: "right",
                      color: "red"
                    }}
                    onClick={() => tearDownMetabase()}
                  >
                    <DeleteIcon /> Delete
                  </Button>
                </div>
              )}
              {statusResponse.isSetupComplete() && statusResponse.isAnyJobInProgress() && (
                <div className={classes.buttonsContainer}>
                  <Button disabled={true}>
                    <DeleteIcon /> Delete
                  </Button>
                </div>
              )}
              {statusResponse.isSetupComplete() && (
                <div className={classes.setupButtonContainer}>
                  <Button className={classes.refreshButton} onClick={refreshReports}>
                    Refresh Reports
                  </Button>
                </div>
              )}
              {statusResponse.isCreateQuestionInProgress() && (
                <div className={classes.setupButtonContainer}>
                  <Button className={classes.refreshButton} disabled={true}>
                    Refresh Reports
                  </Button>
                </div>
              )}
              {statusResponse.isSetupComplete() && (
                <div className={classes.buttonsContainer}>
                  <Button
                    className={classes.exploreButton}
                    href="https://reporting.avniproject.org"
                    target="_blank"
                    disabled={statusResponse.isAnyJobInProgress()}
                  >
                    Explore Your Data
                  </Button>
                </div>
              )}
              {statusResponse.isAnyJobInProgress() && (
                <div className={classes.buttonsContainer}>
                  <CircularProgress size={24} />
                  <Box />
                </div>
              )}
            </Box>
          </Box>
          {statusResponse.hasErrorMessage() && (
            <>
              <Typography variant="h6" color="error">
                Last attempt failed with error
              </Typography>
              <Typography variant="body2" color="error">
                {statusResponse.getShortErrorMessage()}
              </Typography>
              <br />
              <CopyToClipboard text={statusResponse.getErrorMessage()}>
                <button>Copy error to clipboard</button>
              </CopyToClipboard>
            </>
          )}
        </CardContent>
      </Card>
    </ScreenWithAppBar>
  );
};

export default SelfServiceReports;
